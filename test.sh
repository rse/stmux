#!/bin/bash
STMUX="node ./bin/stmux.js"

should_not_crash_on_reading_from_stdin() {
    tmp=$(mktemp)
    (printf '\n' | faketty $STMUX ) > $tmp

    # if everything goes alright, we expect this error message
    if ! grep 'stmux: ERROR: Expected "\[" but end of input found.' $tmp  > /dev/null ; then
        echo "Did not find expected output. Got $(cat $tmp)"
        return 1
    fi
}

should_run_basic_use_case(){
    $STMUX -n -w error -e "ERROR,!style errors" -m beep,system -- [ -s 2/3 [ -s 60% -e foo -t shell $SHELL .. 'date; true' ] : 'date; true' ]
}

run_all_tests(){
    for f in $(declare -F | grep should_ | sed 's/declare -f//'); do 
        $f || exit 1 # exit on first error
    done
}

faketty () {
  # Create a temporary file for storing the status code
  tmp=$(mktemp)

  # Ensure it worked or fail with status 99
  [ "$tmp" ] || return 99

  # Produce a script that runs the command provided to faketty as
  # arguments and stores the status code in the temporary file
  cmd="$(printf '%q ' "$@")"'; echo $? > '$tmp

  # Run the script through /bin/sh with fake tty
  if [ "$(uname)" = "Darwin" ]; then
    # MacOS
    script -Fq /dev/null /bin/sh -c "$cmd"
  else
    script -qfc "/bin/sh -c $(printf "%q " "$cmd")" /dev/null
  fi

  # Ensure that the status code was written to the temporary file or
  # fail with status 99
  [ -s $tmp ] || return 99

  # Collect the status code from the temporary file
  err=$(cat $tmp)

  # Remove the temporary file
  rm -f $tmp

  # Return the status code
  return $err
}

run_all_tests
